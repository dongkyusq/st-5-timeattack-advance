import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { todoApi } from "../api/todos";

export default function TodoList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: todos,
    error,
    isPending,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await todoApi.get("/todos");
      return response.data;
    },
  });

  const mutation = useMutation(
    ({ id, currentLiked }) =>
      todoApi.patch(`/todos/${id}`, { liked: !currentLiked }),
    {
      onMutate: async ({ id, currentLiked }) => {
        await queryClient.cancelQueries(["todos"]);
        const previousTodos = queryClient.getQueryData(["todos"]);

        queryClient.setQueryData(["todos"], (prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, liked: !todo.liked } : todo
          )
        );

        return { previousTodos };
      },
      onError: (err, variables, context) => {
        console.error(err);
        queryClient.setQueryData(["todos"], context.previousTodos);
      },
      onSettled: () => {
        queryClient.invalidateQueries(["todos"]);
      },
    }
  );

  if (isPending) {
    return <div style={{ fontSize: 36 }}>로딩중...</div>;
  }

  if (error) {
    console.error(error);
    return (
      <div style={{ fontSize: 24 }}>에러가 발생했습니다: {error.message}</div>
    );
  }

  return (
    <ul style={{ listStyle: "none", width: 250 }}>
      {todos.map((todo) => (
        <li
          key={todo.id}
          style={{
            border: "1px solid black",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{todo.title}</h3>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => navigate(`/detail/${todo.id}`)}>
              내용보기
            </button>
            {todo.liked ? (
              <FaHeart
                onClick={() =>
                  mutation.mutate({ id: todo.id, currentLiked: todo.liked })
                }
                style={{ cursor: "pointer" }}
              />
            ) : (
              <FaRegHeart
                onClick={() =>
                  mutation.mutate({ id: todo.id, currentLiked: todo.liked })
                }
                style={{ cursor: "pointer" }}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
